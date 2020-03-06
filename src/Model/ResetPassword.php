<?php

namespace App\Model;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Model for the reset password form type.
 */
class ResetPassword
{
  /**
   * The password.
   *
   * @var string
   * @Assert\NotBlank(message="Password cannot be blank.")
   */
  private $password;

  /**
   * Get the password.
   *
   * @return string|null
   */
  public function getPassword(): ?string
  {
    return $this->password;
  }

  /**
   * Set the password.
   *
   * @param string
   * @return self
   */
  public function setPassword(string $password): self
  {
    $this->password = $password;
    return $this;
  }
}
