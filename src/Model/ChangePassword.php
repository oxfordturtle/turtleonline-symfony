<?php

namespace App\Model;

use Symfony\Component\Security\Core\Validator\Constraints as SecurityAssert;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Model for the change password form type.
 */
class ChangePassword
{
  /**
   * The user's current password.
   *
   * @var string
   * @SecurityAssert\UserPassword(message = "Wrong value for your current password.")
   */
  private $currentPassword;

  /**
   * The new password.
   *
   * @var string
   * @Assert\NotBlank(message="Password cannot be blank.")
   */
  private $newPassword;

  /**
   * Get the user's current password.
   *
   * @return string|null
   */
  public function getCurrentPassword(): ?string
  {
    return $this->currentPassword;
  }

  /**
   * Set the user's current password.
   *
   * @param string
   * @return self
   */
  public function setCurrentPassword(string $currentPassword): self
  {
    $this->currentPassword = $currentPassword;
    return $this;
  }

  /**
   * Get the new password.
   *
   * @return string|null
   */
  public function getNewPassword(): ?string
  {
    return $this->newPassword;
  }

  /**
   * Set the new password.
   *
   * @param string
   * @return self
   */
  public function setNewPassword(string $newPassword): self
  {
    $this->newPassword = $newPassword;
    return $this;
  }
}
